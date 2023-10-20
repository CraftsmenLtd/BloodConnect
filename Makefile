sphinx-init:
	docker run -it --rm -v $(PWD)/docs:/docs sphinxdoc/sphinx sphinx-quickstart

sphinx-html:
	docker run --rm -v $(PWD)/docs:/docs sphinxdoc/sphinx make html